import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { activityEvents } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";
export async function POST(request:Request){try{const body=await request.json() as {event?:string;path?:string;productSlug?:string};const event=body.event?.slice(0,50);const path=body.path?.slice(0,200);if(!event||!path)return Response.json({error:"event and path required"},{status:400});const [row]=await getDb().insert(activityEvents).values({event,path,productSlug:body.productSlug?.slice(0,100)??null,createdAt:Date.now()}).returning();return Response.json({event:row},{status:201})}catch{return Response.json({accepted:true},{status:202})}}
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:"Unauthorized"},{status:401});try{const rows=await getDb().select().from(activityEvents).orderBy(desc(activityEvents.createdAt)).limit(50);return Response.json({events:rows})}catch{return Response.json({events:[]})}}

