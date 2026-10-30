// Fallback while any panel page loads; Questions pages have their own shapes.
import { PageSkeleton } from "@/components/page-skeletons";

export default function Loading() {
    return <PageSkeleton />;
}
