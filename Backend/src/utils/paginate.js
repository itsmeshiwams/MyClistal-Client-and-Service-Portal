// src/utils/paginate.js

/**
 * Universal pagination for aggregation pipelines.
 * Applies pagination after all filters and search (on full dataset).
 */
export const paginateAggregation = async (
  model,
  basePipeline = [],
  { page = 1, limit = 15 } = {}
) => {
  const skip = (page - 1) * limit;

  // 🔢 Count total documents *after filtering/search*
  const countPipeline = [...basePipeline, { $count: "total" }];
  const countResult = await model.aggregate(countPipeline);
  const totalDocuments = countResult[0]?.total || 0;
  const totalPages = Math.ceil(totalDocuments / limit);

  // 📄 Paginate actual data after filtering/sorting
  const dataPipeline = [
    ...basePipeline,
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "uploadedBy",
        foreignField: "_id",
        as: "uploadedByData",
      },
    },
    { $unwind: { path: "$uploadedByData", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: 1,
        type: 1,
        status: 1,
        size: 1,
        fileUrl: 1,
        uploadedDate: 1,
        lastModified: 1,
        "clientData.email": 1,
        "uploadedByData.email": 1,
        "uploadedByData.role": 1,
      },
    },
  ];

  const data = await model.aggregate(dataPipeline);

  const nextPageNumber = page < totalPages ? page + 1 : null;
  const prevPageNumber = page > 1 ? page - 1 : null;

  return {
    data,
    pagination: {
      totalDocuments,
      totalPages,
      currentPage: page,
      limit,
      nextPageNumber,
      prevPageNumber,
    },
  };
};
