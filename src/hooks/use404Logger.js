import { useEffect } from "react";
import { error as logError } from '@/lib/log';

export function use404Logger(pathname) {
    useEffect(() => {
        logError("404 Error: User attempted to access non-existent route:", pathname);
    }, [pathname]);
}
