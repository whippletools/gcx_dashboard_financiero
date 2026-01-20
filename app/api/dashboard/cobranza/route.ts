import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("cobranza_raw").select("*").order("Fecha", { ascending: false })

    if (error) {
      console.error("Error fetching cobranza data:", error)
      return NextResponse.json({ error: "Failed to fetch cobranza data" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in cobranza API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
