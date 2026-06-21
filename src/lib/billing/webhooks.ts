import { db } from '@/lib/db'

export async function alreadyProcessed(provider:string,eventId:string){
  return !!(await db.paymentEvent.findUnique({where:{eventId}}))
}

export async function savePaymentEvent(provider:string,eventId:string,eventType:string,payload:any){
  return db.paymentEvent.create({
    data:{
      provider,
      eventId,
      eventType,
      payload:JSON.stringify(payload).slice(0,50000)
    }
  })
}
