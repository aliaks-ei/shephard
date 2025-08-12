import { supabase } from 'src/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from 'src/lib/supabase/types'
import { isDuplicateNameError, createDuplicateNameError } from 'src/utils/database'

type MainTableName = 'expense_categories' | 'expense_templates' | 'plans'
type ShareTableName = 'plan_shares' | 'template_shares'
type ItemsTableName = 'expense_template_items' | 'plan_items'

export interface EntityConfig<TName extends MainTableName> {
  tableName: TName
  shareTableName?: ShareTableName
  itemsTableName?: ItemsTableName
  uniqueConstraintName: string
  entityTypeName: 'PLAN' | 'TEMPLATE' | 'CATEGORY'
  shareTableForeignKeyColumn?: string
}

export interface SharedUser {
  user_id: string
  user_name: string
  user_email: string
  permission_level: string
  shared_at: string
}

export interface EntityWithPermission {
  permission_level?: string
  is_shared?: boolean
  [key: string]: unknown
}

export class BaseAPIService<
  TName extends MainTableName,
  TEntity extends Tables<TName>,
  TInsert extends TablesInsert<TName>,
  TUpdate extends TablesUpdate<TName>,
  TWithItems = TEntity,
  TWithPermission = TEntity & EntityWithPermission,
> {
  private async rpcRaw<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
    const { data, error } = await (
      supabase as unknown as {
        rpc: (fn: string, args?: unknown) => Promise<{ data: unknown; error: unknown }>
      }
    ).rpc(fn, args)

    if (error) throw error as Error
    return data as T
  }

  constructor(protected config: EntityConfig<TName>) {}

  async create(entity: TInsert): Promise<TEntity> {
    const { data, error } = await supabase
      .from(this.config.tableName)
      .insert(entity as never)
      .select()
      .single()

    if (error) {
      if (isDuplicateNameError(error, this.config.uniqueConstraintName)) {
        throw createDuplicateNameError(this.config.entityTypeName)
      }
      throw error
    }

    return data as TEntity
  }

  async update(id: string, updates: TUpdate): Promise<TEntity> {
    const { data, error } = await supabase
      .from(this.config.tableName)
      .update(updates as never)
      .match({ id })
      .select()
      .single()

    if (error) {
      if (isDuplicateNameError(error, this.config.uniqueConstraintName)) {
        throw createDuplicateNameError(this.config.entityTypeName)
      }
      throw error
    }

    return data as TEntity
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(this.config.tableName).delete().match({ id })

    if (error) throw error
  }

  async findById(id: string): Promise<TEntity | null> {
    const { data, error } = await supabase
      .from(this.config.tableName)
      .select('*')
      .match({ id })
      .maybeSingle()

    if (error) throw error
    return data as TEntity | null
  }

  /**
   * User-scoped entity fetching with ownership and sharing
   */
  async getEntitiesWithPermissions(
    userId: string,
    entityColumnName?: string,
  ): Promise<TWithPermission[]> {
    if (!this.config.shareTableName) {
      throw new Error('Sharing is not supported for this entity')
    }
    const shareTable = this.config.shareTableName
    // Get owned entities with sharing status
    const { data: ownedEntities, error: ownedError } = await supabase
      .from(this.config.tableName)
      .select(`*, ${shareTable}!left(id)`)
      .match({ owner_id: userId })
      .order('created_at', { ascending: false })

    if (ownedError) throw ownedError

    // Transform owned entities to include is_shared flag
    const ownedEntitiesWithShares = (ownedEntities || []).map((raw) => {
      const entity = raw as unknown as Record<string, unknown>
      const shares = entity[shareTable]
      const isShared = Array.isArray(shares) && shares.length > 0
      // Remove the join payload key if present
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [shareTable]: _omit, ...rest } = entity
      return { ...(rest as unknown as TEntity), is_shared: isShared } as TWithPermission
    })

    // Get shared entities
    const entityColumn = entityColumnName || this.config.tableName
    const { data: sharedEntitiesData, error: sharedError } = await supabase
      .from(shareTable)
      .select(`permission_level, ${entityColumn} (*)`)
      .match({ shared_with_user_id: userId })

    if (sharedError) throw sharedError

    const sharedEntities = (sharedEntitiesData || []).map((raw) => {
      const share = raw as unknown as Record<string, unknown>
      const entity = share[entityColumn] as TEntity
      const permission = share.permission_level as string | undefined
      return { ...(entity as unknown as TEntity), permission_level: permission } as TWithPermission
    })

    const allEntities = [...ownedEntitiesWithShares, ...sharedEntities]

    return allEntities.sort(
      (a, b) =>
        new Date((b as { created_at?: string }).created_at || '').getTime() -
        new Date((a as { created_at?: string }).created_at || '').getTime(),
    )
  }

  /**
   * Get entity with items and permission checking
   */
  async getEntityWithItems(
    entityId: string,
    userId: string,
    itemsRelation: string,
  ): Promise<(TWithItems & { permission_level?: string }) | null> {
    const { data: entity, error } = await supabase
      .from(this.config.tableName)
      .select(`*, ${itemsRelation} (*)`)
      .match({ id: entityId })
      .maybeSingle()

    if (error) throw error
    if (!entity) return null

    // If user is the owner, no need to check permissions
    const ownedBy = (entity as unknown as { owner_id?: string }).owner_id
    if (ownedBy === userId) {
      return entity as unknown as TWithItems & { permission_level?: string }
    }

    // Check if entity is shared with this user
    if (!this.config.shareTableName) {
      throw new Error('Sharing is not supported for this entity')
    }
    const shareTable = this.config.shareTableName
    const foreignKeyColumn =
      this.config.shareTableForeignKeyColumn || `${this.config.tableName.slice(0, -1)}_id`
    const { data: share, error: shareError } = await supabase
      .from(shareTable)
      .select('permission_level')
      .eq(foreignKeyColumn as never, entityId as never)
      .eq('shared_with_user_id' as never, userId as never)
      .maybeSingle()

    if (shareError) throw shareError

    if (!share) {
      throw new Error(`${this.config.entityTypeName.toLowerCase()} not found or access denied`)
    }

    return {
      ...(entity as unknown as TWithItems),
      permission_level: (share as unknown as { permission_level?: string }).permission_level,
    } as TWithItems & { permission_level?: string }
  }

  /**
   * Sharing Operations
   */
  async getSharedUsers(entityId: string): Promise<SharedUser[]> {
    // Prefer secure RPCs that encapsulate joins and respect RLS
    if (this.config.tableName === 'expense_templates') {
      const data = await this.rpcRaw<SharedUser[]>('get_template_shared_users', {
        p_template_id: entityId,
      })
      return data || []
    }
    if (this.config.tableName === 'plans') {
      const data = await this.rpcRaw<SharedUser[]>('get_plan_shared_users', {
        p_plan_id: entityId,
      })
      return data || []
    }
    throw new Error('Sharing is not supported for this entity')
  }

  async shareEntity(
    entityId: string,
    userEmail: string,
    permission: 'view' | 'edit',
    sharedByUserId: string,
  ): Promise<void> {
    if (!this.config.shareTableName) {
      throw new Error('Sharing is not supported for this entity')
    }
    // Resolve user by email via secure RPC to avoid broad table SELECT
    const candidates = await this.rpcRaw<{ id: string; email: string; name?: string | null }[]>(
      'search_users_for_sharing',
      { q: userEmail },
    )
    const list = candidates || []
    const targetUser =
      list.find((u) => u.email.toLowerCase() === userEmail.toLowerCase()) || list[0]
    if (!targetUser) {
      throw new Error(`User not found: ${userEmail}`)
    }

    const entityIdColumn =
      this.config.shareTableForeignKeyColumn || `${this.config.tableName.slice(0, -1)}_id`

    // Check if already shared
    const { data: existingShare, error: shareCheckError } = await supabase
      .from(this.config.shareTableName)
      .select('id')
      .eq(entityIdColumn as never, entityId as never)
      .eq('shared_with_user_id' as never, targetUser.id as never)
      .maybeSingle()

    if (shareCheckError) throw shareCheckError
    if (existingShare) {
      throw new Error(`${this.config.entityTypeName} is already shared with ${userEmail}`)
    }

    // Create new share
    const { error: insertError } = await supabase.from(this.config.shareTableName).insert({
      [entityIdColumn]: entityId,
      shared_with_user_id: targetUser.id,
      shared_by_user_id: sharedByUserId,
      permission_level: permission,
    } as never)

    if (insertError) throw insertError
  }

  async unshareEntity(entityId: string, userId: string): Promise<void> {
    if (!this.config.shareTableName) {
      throw new Error('Sharing is not supported for this entity')
    }
    const entityIdColumn =
      this.config.shareTableForeignKeyColumn || `${this.config.tableName.slice(0, -1)}_id`

    const { error } = await supabase
      .from(this.config.shareTableName)
      .delete()
      .eq(entityIdColumn as never, entityId as never)
      .eq('shared_with_user_id' as never, userId as never)

    if (error) throw error
  }

  async updateSharePermission(
    entityId: string,
    userId: string,
    permission: 'view' | 'edit',
  ): Promise<void> {
    if (!this.config.shareTableName) {
      throw new Error('Sharing is not supported for this entity')
    }
    const entityIdColumn =
      this.config.shareTableForeignKeyColumn || `${this.config.tableName.slice(0, -1)}_id`

    const { error } = await supabase
      .from(this.config.shareTableName)
      .update({ permission_level: permission })
      .eq(entityIdColumn as never, entityId as never)
      .eq('shared_with_user_id' as never, userId as never)

    if (error) throw error
  }

  /**
   * Items Operations (for entities that have child items)
   */
  async createItems(items: Record<string, unknown>[]): Promise<unknown[]> {
    if (!this.config.itemsTableName) {
      throw new Error('Items table not configured for this entity type')
    }

    const { data, error } = await supabase
      .from(this.config.itemsTableName)
      .insert(items as never)
      .select()

    if (error) throw error
    return data
  }

  async deleteItems(ids: string[]): Promise<void> {
    if (!this.config.itemsTableName) {
      throw new Error('Items table not configured for this entity type')
    }

    const { error } = await supabase.from(this.config.itemsTableName).delete().in('id', ids)

    if (error) throw error
  }
}
