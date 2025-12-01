import { useEffect } from "react";
import * as log from '@/lib/log';

export function use404Logger(pathname: string) {
  useEffect(() => {
    log.error(
      "404 Error: User attempted to access non-existent route:",
      pathname
    );
  }, [pathname]);
}