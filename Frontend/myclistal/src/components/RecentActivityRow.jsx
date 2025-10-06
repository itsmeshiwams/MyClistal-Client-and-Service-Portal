import React from "react";
import {
  Upload,
  Download,
  Send,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  Trash2,
  Edit,
} from "lucide-react";

/**
 * Map backend action codes to readable labels + icons
 */
const ACTION_MAP = {
  SENT_TO_CLIENT: { label: "Sent to Client", icon: Send },
  PREVIEW: { label: "Previewed", icon: Eye },
  UPLOAD: { label: "Uploaded", icon: Upload },
  REVIEWED: { label: "Reviewed", icon: CheckCircle },
  DELETED: { label: "Deleted", icon: Trash2 },
  EDITED: { label: "Edited", icon: Edit },
  DOWNLOAD: { label: "Downloaded", icon: Download },
  STATUS_CHANGE : { label: "Status Change", icon: Edit },
};

export default function RecentActivityRow({ activity }) {
  const actionInfo = ACTION_MAP[activity.action] || {
    label: activity.action,
    icon: FileText,
  };
  const Icon = actionInfo.icon;
  const timeLabel = new Date(activity.createdAt).toLocaleString();

  return (
    <li className="flex items-center gap-3 border-b cursor-pointer hover:bg-gray-50 last:border-b-0 px-3 py-2 transition">
      <div className="w-9 h-9 flex items-center justify-center bg-gray-50  rounded-full shrink-0">
        <Icon size={18} className="text-blue-800" />
      </div>
      <div className="flex-1">
        <p className="text-gray-800 text-base font-medium">
          {actionInfo.label}
        </p>
        {activity.document?.name && (
          <p className="text-gray-600 text-sm">{activity.document.name}</p>
        )}
        <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
          <Clock size={12} />
          {timeLabel}
        </p>
      </div>
    </li>
  );
}
