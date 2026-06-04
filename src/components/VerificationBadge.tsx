import { VerificationStatus } from "@prisma/client";
import { BadgeCheck, Clock, ShieldAlert, ShieldX } from "lucide-react";
import { Badge } from "./ui/Badge";
import { VERIFICATION_LABELS } from "@/lib/constants";

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  switch (status) {
    case "VERIFIED":
      return (
        <Badge color="green">
          <BadgeCheck className="h-3.5 w-3.5" /> {VERIFICATION_LABELS.VERIFIED}
        </Badge>
      );
    case "PENDING":
      return (
        <Badge color="yellow">
          <Clock className="h-3.5 w-3.5" /> {VERIFICATION_LABELS.PENDING}
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge color="red">
          <ShieldX className="h-3.5 w-3.5" /> {VERIFICATION_LABELS.REJECTED}
        </Badge>
      );
    default:
      return (
        <Badge color="gray">
          <ShieldAlert className="h-3.5 w-3.5" /> {VERIFICATION_LABELS.UNVERIFIED}
        </Badge>
      );
  }
}
