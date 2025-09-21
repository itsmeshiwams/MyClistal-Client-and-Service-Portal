const Card = ({ children }) => (
  <div className="bg-white rounded-lg shadow border">{children}</div>
);

const CardContent = ({ children, className }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

export { Card, CardContent };
