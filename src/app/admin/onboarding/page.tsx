"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle, Circle, Send, Copy, ChevronRight, Loader2, Mail, Phone } from "lucide-react";

const STAGES=[{key:"welcome",label:"Welcome"},{key:"kickoff",label:"Kickoff"},{key:"configuration",label:"Configure"},{key:"build",label:"Build"},{key:"testing",label:"Test"},{key:"launch",label:"Launch"},{key:"handover",label:"Handover"}];
interface Pipeline{id:string;current_stage:string;welcome_email_sent:boolean;clients:{id:string;contact_name:string;email:string;company_name:string}|null;[k:string]:unknown;}

export default function AdminOnboarding(){
  const [pipes,setPipes]=useState<Pipeline[]>([]);
  const [ld,setLd]=useState(true);
  const [sel,setSel]=useState<Pipeline|null>(null);
  const [busy,setBusy]=useState<string|null>(null);
  const [kd,setKd]=useState("");
  const [kt,setKt]=useState("");
  const [kl,setKl]=useState("");
  const [wa,setWa]=useState<string|null>(null);

  const load=async()=>{setLd(true);try{const r=await fetch("/api/admin/pipeline");const d=await r.json();setPipes(d.pipelines||[]);}catch{}setLd(false);};
  useEffect(()=>{load();},[]);

  const advance=async(id:string)=>{setBusy(id);await fetch("/api/admin/pipeline/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"advance"})});await load();if(sel?.id===id){const r=await fetch("/api/admin/pipeline/"+id);const d=await r.json();setSel(d.pipeline);}setBusy(null);};

  const sendEmail=async(id:string,type:string,extra:Record<string,unknown>={})=>{setBusy(id+type);const r=await fetch("/api/admin/pipeline/"+id+"/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,...extra})});const d=await r.json();if(d.whatsappMessage)setWa(d.whatsappMessage);await load();setBusy(null);};

  if(ld)return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#3B66E8] animate-spin" /></div>;
  return(
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-[#9CA3AF] hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
          <Image src="/brand/elion-e-icon.svg" alt="E" width={24} height={24} />
          <h1 className="text-xl font-bold text-white">Onboarding</h1>
          <button onClick={load} className="ml-auto text-xs text-[#9CA3AF] hover:text-white">Refresh</button>
        </div>
        {pipes.length===0?<p className="text-[#7C8494]">No pipelines found.</p>:(
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              {pipes.map(p=>{const idx=STAGES.findIndex(s=>s.key===p.current_stage);const c=p.clients;return(
                <button key={p.id} onClick={()=>{setSel(p);setWa(null);}} className={"w-full text-left p-4 rounded-xl border "+(sel?.id===p.id?"border-[#3B66E8] bg-[#3B66E8]/5":"border-[#1F2937] bg-[#11161F]")}>
                  <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium text-white">{c?.company_name||"Unknown"}</span><span className="text-xs px-2 py-0.5 rounded bg-[#3B66E8]/20 text-[#3B66E8]">{p.current_stage}</span></div>
                  <p className="text-xs text-[#7C8494]">{c?.contact_name} - {c?.email}</p>
                  <div className="flex gap-0.5 mt-2">{STAGES.map((s,i)=><div key={s.key} className={"h-1 flex-1 rounded-full "+(i<idx?"bg-[#10B981]":i===idx?"bg-[#3B66E8]":"bg-[#1F2937]")} />)}</div>
                </button>);})}
            </div>
            <div className="lg:col-span-2">
              {sel?(
                <div className="space-y-6">
                  <div className="p-6 rounded-xl border border-[#1F2937] bg-[#11161F]">
                    <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-bold text-white">{sel.clients?.company_name}</h2><p className="text-sm text-[#7C8494]">{sel.clients?.contact_name} - {sel.clients?.email}</p></div><button onClick={()=>advance(sel.id)} disabled={busy===sel.id} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B66E8] text-white text-sm font-semibold disabled:opacity-50">{busy===sel.id?<Loader2 className="w-4 h-4 animate-spin"/>:<ChevronRight className="w-4 h-4"/>}Advance</button></div>
                    {STAGES.map((s,i)=>{const idx=STAGES.findIndex(st=>st.key===sel.current_stage);const done=i<idx;const cur=i===idx;return(
                      <div key={s.key} className="flex items-center gap-3 py-2"><div className={"w-7 h-7 rounded-full flex items-center justify-center "+(done?"bg-[#10B981]/20":cur?"bg-[#3B66E8]/20":"bg-[#0A0D14]")}>{done?<CheckCircle className="w-4 h-4 text-[#10B981]"/>:cur?<div className="w-2 h-2 rounded-full bg-[#3B66E8]"/>:<Circle className="w-4 h-4 text-[#1F2937]"/>}</div><span className={"text-sm "+(cur?"text-white font-medium":done?"text-[#9CA3AF]":"text-[#4B5563]")}>{s.label}</span>{done&&<span className="text-xs text-[#10B981]">Done</span>}{cur&&<span className="text-xs text-[#3B66E8]">Current</span>}</div>);})}
                  </div>
                  <div className="p-6 rounded-xl border border-[#1F2937] bg-[#11161F]"><h3 className="text-xs font-semibold text-[#7C8494] uppercase tracking-wider mb-4">Actions</h3>
                    {sel.current_stage==="welcome"&&<div className="space-y-3"><p className="text-sm text-[#9CA3AF]">Send welcome email to {sel.clients?.contact_name}.</p><button onClick={()=>sendEmail(sel.id,"welcome")} disabled={!!busy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#047857] text-white text-sm font-semibold disabled:opacity-50"><Mail className="w-4 h-4"/>Send Welcome Email</button>{sel.welcome_email_sent&&<p className="text-xs text-[#10B981]">Sent</p>}</div>}
                    {sel.current_stage==="kickoff"&&<div className="space-y-3"><div className="grid grid-cols-3 gap-3"><input type="date" value={kd} onChange={e=>setKd(e.target.value)} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm"/><input type="time" value={kt} onChange={e=>setKt(e.target.value)} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm"/><input type="text" placeholder="Meeting link" value={kl} onChange={e=>setKl(e.target.value)} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm"/></div><button onClick={()=>sendEmail(sel.id,"kickoff_whatsapp",{date:kd,time:kt,callLink:kl})} disabled={!!busy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-semibold disabled:opacity-50"><Phone className="w-4 h-4"/>Generate WhatsApp</button></div>}
                    {sel.current_stage==="handover"&&<div className="space-y-3"><button onClick={()=>sendEmail(sel.id,"completion",{automationName:"Lead Response",connectedSystems:["WhatsApp","Email","Calendar"],workflowDescription:"Automated lead capture, qualification, response, follow-up, and booking."})} disabled={!!busy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B66E8] text-white text-sm font-semibold disabled:opacity-50"><Send className="w-4 h-4"/>Send Completion Email</button></div>}
                  </div>
                  {wa&&<div className="p-4 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5"><div className="flex items-center justify-between mb-2"><h3 className="text-sm font-semibold text-[#25D366]">WhatsApp Message</h3><button onClick={()=>navigator.clipboard.writeText(wa)} className="text-xs text-[#9CA3AF] hover:text-white">Copy</button></div><pre className="text-sm text-[#9CA3AF] whitespace-pre-wrap font-sans">{wa}</pre></div>}
                </div>
              ):<p className="text-[#7C8494]">Select a client.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
