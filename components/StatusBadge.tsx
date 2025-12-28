import { CallSuccessful } from "@/generated/prisma/enums";

interface StatusBadgeProps {
  status: CallSuccessful | null;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === CallSuccessful.success) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
        Success
      </span>
    );
  } else if (status === CallSuccessful.failure) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
        Failed
      </span>
    );
  } else if (status === CallSuccessful.unknown) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
        Unknown
      </span>
    );
  } else {
    // Handle null case
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
        No Status
      </span>
    );
  }
}

