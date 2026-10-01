import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { SeoEntityType } from "@prisma/client";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
export async function GET(request:NextRequest){await requireAdmin();const parsed=z.object({keyword:z.string().trim().min(1).max(100),entityType:z.nativeEnum(SeoEntityType),entityId:z.string().max(200)}).safeParse({keyword:request.nextUrl.searchParams.get("keyword"),entityType:request.nextUrl.searchParams.get("entityType"),entityId:request.nextUrl.searchParams.get("entityId")});if(!parsed.success)return NextResponse.json({error:"Parameter tidak valid."},{status:400});const found=await prisma.seoMeta.findFirst({where:{focusKeyword:{equals:parsed.data.keyword,mode:"insensitive"},NOT:{entityType:parsed.data.entityType,entityId:parsed.data.entityId}},select:{id:true}});return NextResponse.json({used:Boolean(found)});}
