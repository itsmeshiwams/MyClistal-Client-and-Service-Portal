import { Card, CardContent } from "../components/Card";
import {
  ClipboardList,
  FileText,
  Calendar,
  Mail,
  DollarSign,
  ShieldAlert,
} from "lucide-react";

export default function StaffDashboard({ data }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 p-4">
      {/* Tasks Overview */}
      <Card className="hover:shadow-lg transition rounded-2xl flex flex-col">
        <CardContent className="p-6 flex flex-col flex-grow">
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-xl mb-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Tasks Overview
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Monitor your assigned tasks
          </p>
          <div className="divide-y divide-gray-200 text-base flex-grow">
            <div className="flex justify-between py-2">
              <span>Total Tasks</span>
              <span className="font-semibold">{data.tasksOverview.total}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Pending</span>
              <span className="font-semibold text-orange-600">
                {data.tasksOverview.pending}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span>Overdue</span>
              <span className="font-semibold text-red-600">
                {data.tasksOverview.overdue}
              </span>
            </div>
          </div>
          <button className="mt-6 w-full border cursor-pointer border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
            View All Tasks
          </button>
        </CardContent>
      </Card>

      {/* Documents Management */}
      <Card className="hover:shadow-lg transition rounded-2xl flex flex-col">
        <CardContent className="p-6 flex flex-col flex-grow">
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-xl mb-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Documents Management
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Manage client and internal documents
          </p>
          <div className="divide-y divide-gray-200 text-base flex-grow">
            <div className="flex justify-between py-2">
              <span>Pending Review</span>
              <span className="font-semibold">
                {data.documentsManagement.pendingReview}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span>Recent Uploads</span>
              <span className="font-semibold">
                {data.documentsManagement.recentUploads}
              </span>
            </div>
          </div>
          <button className="mt-6 w-full border cursor-pointer border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
            Manage Documents
          </button>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="hover:shadow-lg transition rounded-2xl flex flex-col">
        <CardContent className="p-6 flex flex-col flex-grow">
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-xl mb-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Upcoming Events
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Important deadlines and meetings
          </p>
          <div className="divide-y divide-gray-200 text-base flex-grow">
            {data.upcomingEvents.map((event, idx) => (
              <div key={idx} className="flex justify-between py-2">
                <span>{event.title}</span>
                <span className="font-semibold text-gray-700">{event.date}</span>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full border cursor-pointer border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
            View Calendar
          </button>
        </CardContent>
      </Card>

      {/* Recent Communications */}
      <Card className="hover:shadow-lg transition rounded-2xl flex flex-col">
        <CardContent className="p-6 flex flex-col flex-grow">
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-xl mb-2">
            <Mail className="w-6 h-6 text-blue-600" />
            Recent Communications
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Client and internal messages
          </p>
          <div className="divide-y divide-gray-200 text-base flex-grow">
            <div className="flex justify-between py-2">
              <span>Unread Messages</span>
              <span className="font-semibold text-blue-600">
                {data.recentCommunications.unreadMessages}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span>Latest Client Message</span>
              <span className="font-semibold text-gray-700 truncate max-w-[150px]">
                {data.recentCommunications.latestClientMessage}
              </span>
            </div>
          </div>
          <button className="mt-6 w-full border cursor-pointer border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
            View Communications
          </button>
        </CardContent>
      </Card>

      {/* Billing Summary */}
      <Card className="hover:shadow-lg transition rounded-2xl flex flex-col">
        <CardContent className="p-6 flex flex-col flex-grow">
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-xl mb-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
            Billing Summary
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Overview of client billing status
          </p>
          <div className="divide-y divide-gray-200 text-base flex-grow">
            <div className="flex justify-between py-2">
              <span>Invoices Due</span>
              <span className="font-semibold text-orange-600">
                {data.billingSummary.invoicesDue}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span>Payments Processed</span>
              <span className="font-semibold text-green-600">
                ${data.billingSummary.paymentsProcessed}
              </span>
            </div>
          </div>
          <button className="mt-6 w-full cursor-pointer border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
            Manage Billing
          </button>
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card className="hover:shadow-lg transition rounded-2xl flex flex-col">
        <CardContent className="p-6 flex flex-col flex-grow">
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-xl mb-2">
            <ShieldAlert className="w-6 h-6 text-blue-600" />
            Compliance Status
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Monitor legal and regulatory adherence
          </p>
          <div className="divide-y divide-gray-200 text-base flex-grow">
            <div className="flex justify-between py-2">
              <span>Alerts Active</span>
              <span className="font-semibold text-red-600">
                {data.complianceStatus.activeAlerts}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span>Next Audit</span>
              <span className="font-semibold text-gray-700">
                {data.complianceStatus.nextAudit}
              </span>
            </div>
          </div>
          <button className="mt-6 w-full border cursor-pointer border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
            Monitor Compliance
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
