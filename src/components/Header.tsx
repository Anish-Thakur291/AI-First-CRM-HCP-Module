/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export default function Header() {
  return (
    <header id="app-header" className="border-b border-slate-200 bg-white sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title and Branding */}
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
              Life Sciences Field Detailing Portal
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 mt-0.5">
            HCP CRM Companion <span className="text-xs font-normal text-slate-400 font-mono">v1.2.0</span>
          </h1>
        </div>
      </div>
    </header>
  );
}
