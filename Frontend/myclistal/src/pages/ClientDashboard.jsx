import { Card, CardContent } from "../components/Card";
import {
  Clock,
  FileText,
  Calendar,
  DollarSign,
  ShieldAlert,
  Mail,
} from "lucide-react";

export default function ClientDashboard({ data }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Pending Tasks */}
      <Card className="shadow-lg border border-gray-100 rounded-2xl hover:shadow-xl transition">
        <CardContent>
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            Pending Tasks
          </h3>
          <ul className="space-y-3">
            {data.pendingTasks.map((task, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center text-base bg-gray-50 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="font-medium text-gray-800">{task.title}</span>
                <span
                  className={`px-2 py-1 rounded-md text-xs font-semibold shadow-sm ${
                    task.status === "Overdue"
                      ? "bg-red-100 text-red-600"
                      : task.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Unread Documents */}
      <Card className="shadow-lg border border-gray-100 rounded-2xl hover:shadow-xl transition">
        <CardContent>
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-4">
            <FileText className="w-6 h-6 text-blue-600" />
            Unread Documents
          </h3>
          <ul className="space-y-3 text-base">
            {data.unreadDocuments.map((doc, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="text-gray-800 font-medium">{doc.name}</span>
                <span className="text-gray-500 text-sm">{doc.date}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="shadow-lg border border-gray-100 rounded-2xl hover:shadow-xl transition">
        <CardContent>
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            Upcoming Events
          </h3>
          <ul className="space-y-3 text-base">
            {data.upcomingEvents.map((event, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="text-gray-800 font-medium">{event.title}</span>
                <span className="text-gray-500 text-sm">{event.date}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Outstanding Invoices */}
      <Card className="shadow-lg border border-gray-100 rounded-2xl hover:shadow-xl transition">
        <CardContent>
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-4">
            <DollarSign className="w-6 h-6 text-blue-600" />
            Outstanding Invoices
          </h3>
          <p className="text-4xl font-bold text-gray-900">
            ${data.outstandingInvoices.amount}
          </p>
          <p className="text-base text-gray-500 mt-2">
            {data.outstandingInvoices.status}
          </p>
        </CardContent>
      </Card>

      {/* Compliance Alerts */}
      <Card className="shadow-lg border border-gray-100 rounded-2xl hover:shadow-xl transition">
        <CardContent>
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-4">
            <ShieldAlert className="w-6 h-6 text-blue-600" />
            Compliance Alerts
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {data.complianceAlerts.count}
          </p>
          <p className="text-base text-gray-500 mt-2">
            {data.complianceAlerts.message}
          </p>
        </CardContent>
      </Card>

      {/* Recent Communications */}
      <Card className="shadow-lg border border-gray-100 rounded-2xl hover:shadow-xl transition xl:col-span-2">
        <CardContent>
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
            Recent Communications
          </h3>
          <ul className="space-y-4 text-base">
            {data.recentCommunications.map((msg, idx) => (
              <li
                key={idx}
                className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition"
              >
                <p className="font-semibold text-gray-900">{msg.from}</p>
                <p className="text-gray-700">{msg.message}</p>
                <p className="text-sm text-gray-400 mt-1">{msg.timeAgo}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
