const Card = ({ children }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col justify-between">
    {children}
  </div>
);

const CardContent = ({ children, className }) => (
  <div className={`space-y-4 ${className}`}>{children}</div>
);

export { Card, CardContent };
