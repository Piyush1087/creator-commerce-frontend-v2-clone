import { useEffect, useState } from "react";

import { ChevronRight } from "lucide-react";

import { useLocation } from "react-router-dom";



import {

  isCoPilotDashboardPath,

  openCoPilotThreadDrawer,

} from "../../features/co-pilot/co-pilot-mobile-bridge";

import { useAppShellBreadcrumbs } from "./use-app-shell-breadcrumbs";



export function MobileShellNav() {

  const location = useLocation();

  const { breadcrumb, title } = useAppShellBreadcrumbs();

  const isCoPilotDashboard = isCoPilotDashboardPath(location.pathname);



  if (isCoPilotDashboard) {

    return (

      <button

        type="button"

        className="aurora-mobile-shell-nav aurora-mobile-shell-nav--interactive"

        aria-label="Open conversation history"

        onClick={() => openCoPilotThreadDrawer()}

      >

        <span>{breadcrumb}</span>

        <ChevronRight size={14} aria-hidden className="aurora-mobile-shell-nav__separator" />

        <span className="aurora-mobile-shell-nav__current">{title}</span>

      </button>

    );

  }



  return (

    <nav className="aurora-mobile-shell-nav" aria-label="Page location">

      <span>{breadcrumb}</span>

      <ChevronRight size={14} aria-hidden className="aurora-mobile-shell-nav__separator" />

      <span className="aurora-mobile-shell-nav__current">{title}</span>

    </nav>

  );

}

