export function groupActivities(activities) {
  const now = new Date();

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfDay);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const groups = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    "This Month": [],
    "This Year": [],
  };

  activities.forEach((activity) => {
    const created = new Date(activity.createdAt);
    if (created >= startOfDay) {
      groups.Today.push(activity);
    } else if (created >= startOfYesterday && created < startOfDay) {
      groups.Yesterday.push(activity);
    } else if (created >= startOfWeek) {
      groups["This Week"].push(activity);
    } else if (created >= startOfMonth) {
      groups["This Month"].push(activity);
    } else if (created >= startOfYear) {
      groups["This Year"].push(activity);
    }
  });

  return groups;
}
