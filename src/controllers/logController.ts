import { Request, Response } from "express";
import { LogModel } from "../models/logModel";

export const getLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, module, action, severity, userId } = req.query;

    const query: any = {};

    if (module) query.module = module;
    if (action) query.action = action;
    if (severity) query.severity = severity;
    if (userId) query.userId = userId;

    const logs = await LogModel.find(query)
      .sort({ createdOn: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const total = await LogModel.countDocuments(query);

    res.json({
      data: logs,
      page: +page,
      limit: +limit,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};
