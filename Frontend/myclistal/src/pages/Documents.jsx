import { useEffect, useState } from "react";
import { fetchMyDocuments } from "../api/documents";

const Documents = () => {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    const loadDocs = async () => {
      const data = await fetchMyDocuments();
      setDocs(data);
    };
    loadDocs();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Client Documents</h1>
        <button className="px-3 py-1 border rounded">Upload Document</button>
      </div>

      <table className="w-full border-collapse border rounded">
        <thead className="bg-gray-100 text-left text-sm">
          <tr>
            <th className="p-2">Document Name</th>
            <th className="p-2">Type</th>
            <th className="p-2">Uploaded Date</th>
            <th className="p-2">Size</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {docs.map((doc) => (
            <tr key={doc._id} className="border-t">
              <td className="p-2">{doc.title}</td>
              <td className="p-2">{doc.type}</td>
              <td className="p-2">{new Date(doc.createdAt).toLocaleDateString()}</td>
              <td className="p-2">{(doc.size / 1024 / 1024).toFixed(2)} MB</td>
              <td className="p-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    doc.status === "Approved"
                      ? "bg-green-100 text-green-700"
                      : doc.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {doc.status}
                </span>
              </td>
              <td className="p-2 space-x-2">
                <button className="text-blue-600">👁</button>
                <button className="text-gray-600">⬇</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Documents;
