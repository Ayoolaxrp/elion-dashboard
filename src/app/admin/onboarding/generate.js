"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Circle, Clock, Send, Copy, ChevronRight, Settings, Loader2 } from "lucide-react";
const S=[{k:"welcome",l:"Welcome",d:"Send welcome email"},{k:"kickoff",l:"Kickoff",d:"Schedule call"},{k:"configuration",l:"Configuration",d:"Configure automations"},{k:"build",l:"Build",d:"Build and deploy"},{k:"testing",l:"Testing",d:"Verify everything works"},{k:"launch",l:"Launch",d:"Go live"},{k:"handover",l:"Handover",d:"Send completion email"}];
interface P{id:string;client_id:string;current_stage:string;welcome_email_sent:boolean;kickoff_message_sent:boolean;completion_email_sent:boolean;admin_notes:string;kickoff_date:string;kickoff_time:string;kickoff_call_link:string;clients:{id:string;contact_name:string;email:string;company_name:string}|null;}