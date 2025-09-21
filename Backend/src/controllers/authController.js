import { loginUser } from "../services/authService.js";

export const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const result = await loginUser(email, password, role);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
