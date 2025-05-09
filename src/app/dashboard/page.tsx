"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface Room {
  id: string;
  name: string;
  code: string;
  entryFee: number;
  roundCount: number;
  status: "waiting" | "active" | "finished";
}

export default function Dashboard() {
  console.log("DASHBOARD ATIVO");
  return <div style={{ color: "red", fontSize: 40 }}>DASHBOARD TESTE</div>;
}
