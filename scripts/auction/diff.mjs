const trackedChanges = [
  ['auctionDate', 'AUCTION_DATE_CHANGED'],
  ['minimumPrice', 'MINIMUM_PRICE_CHANGED'],
  ['normalizedStatus', 'STATUS_CHANGED'],
]
const event = (date, type, previousValue, newValue) => ({ date, type, previousValue, newValue })

export function mergeWithState(items, previousState, collectedAt, { collectionPolicyVersion = 1 } = {}) {
  const isBootstrap = !previousState.lastSuccessfulCollectedAt
  const isBackfill = !isBootstrap && previousState.collectionPolicyVersion !== collectionPolicyVersion
  const previousItems = previousState.items ?? {}
  const nextItems = { ...previousItems }
  const currentIds = new Set()
  const merged = []
  for (const item of items) {
    currentIds.add(item.id)
    const previous = previousItems[item.id]
    if (!previous) {
      const created = { ...item, isBootstrapItem: isBootstrap || isBackfill, history: [event(collectedAt, 'FIRST_SEEN', null, isBackfill ? '수집 범위 확대 backfill' : '처음 수집')] }
      nextItems[item.id] = { ...created, removedAt: null }
      merged.push(created)
      continue
    }
    const history = [...(previous.history ?? [])]
    let failedAt = previous.failedAt ?? null
    let statusUpdatedAt = previous.statusUpdatedAt ?? previous.firstSeenAt ?? collectedAt
    if (item.failedCount > Number(previous.failedCount ?? 0)) {
      history.push(event(collectedAt, 'FAILED', previous.failedCount, item.failedCount))
      failedAt = collectedAt
      statusUpdatedAt = collectedAt
    }
    for (const [field, type] of trackedChanges) {
      if (previous[field] !== item[field]) {
        history.push(event(collectedAt, type, previous[field] ?? null, item[field] ?? null))
        statusUpdatedAt = collectedAt
      }
    }
    const updated = { ...item, firstSeenAt: previous.firstSeenAt, lastSeenAt: collectedAt, failedAt, statusUpdatedAt, history, isBootstrapItem: previous.isBootstrapItem ?? false }
    nextItems[item.id] = { ...updated, removedAt: null }
    merged.push(updated)
  }
  for (const [id, previous] of Object.entries(previousItems)) {
    if (currentIds.has(id) || previous.removedAt) continue
    nextItems[id] = { ...previous, removedAt: collectedAt, history: [...(previous.history ?? []), event(collectedAt, 'REMOVED', previous.normalizedStatus ?? null, 'REMOVED')] }
  }
  return {
    items: merged,
    state: { schemaVersion: 1, collectionPolicyVersion, lastSuccessfulCollectedAt: collectedAt, items: nextItems },
    isBootstrap,
    isBackfill,
  }
}

export function assertSafeReplacement(previousCount, nextCount, ratio = 0.5) {
  if (nextCount === 0) throw new Error('수집 결과가 0건이라 기존 데이터를 덮어쓰지 않습니다.')
  if (previousCount > 0 && nextCount / previousCount <= ratio) throw new Error(`수집 건수가 ${previousCount}건에서 ${nextCount}건으로 50% 이상 급감해 기존 데이터를 유지합니다.`)
}
