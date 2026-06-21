import { getPlanInfo } from '@/lib/membership'

export function hasFeature(plan:string, feature:string):boolean {
  const info:any = getPlanInfo(plan)
  return Boolean(info[feature])
}
