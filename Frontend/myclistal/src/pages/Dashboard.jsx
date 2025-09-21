import { useEffect, useState } from "react";
import { fetchDashboard } from "../api/dashboard";
import { Card, CardContent } from "../components/Card";

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchDashboard();
      setDashboard(data);
    };
    loadData();
  }, []);

  if (!dashboard) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Client Dashboard</h1>

      {/* Pending Tasks */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-2">Pending Tasks</h2>
          <ul className="space-y-1 text-sm">
            <li>Review Q4 Tax Documents <span className="text-red-500">Overdue</span></li>
            <li>Approve Financial Statements <span className="text-gray-500">Pending</span></li>
            <li>Provide Payroll Information <span className="text-orange-500">Due Soon</span></li>
          </ul>
          <button className="mt-3 px-3 py-1 border rounded">View All Tasks</button>
        </CardContent>
      </Card>

      {/* Other Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-2">Unread Documents</h2>
            <ul className="text-sm space-y-1">
              <li>2023 Tax Return.pdf – <span className="text-gray-500">2024-02-01</span></li>
              <li>Q4 Financial Report.xlsx – <span className="text-gray-500">2024-01-20</span></li>
            </ul>
            <button className="mt-3 px-3 py-1 border rounded">View All Documents</button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-2">Upcoming Events</h2>
            <ul className="text-sm space-y-1">
              <li>Annual Tax Meeting – Feb 20, 2024</li>
              <li>Q1 Financial Review – Mar 05, 2024</li>
              <li>Payroll Submission – Mar 15, 2024</li>
            </ul>
            <button className="mt-3 px-3 py-1 border rounded">View Full Calendar</button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-2">Outstanding Invoices</h2>
            <p className="text-2xl font-bold">$2,500</p>
            <p className="text-sm text-gray-500">pending payments</p>
            <button className="mt-3 px-3 py-1 border rounded">View Billing Details</button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
