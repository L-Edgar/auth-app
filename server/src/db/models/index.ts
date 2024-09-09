import { Model, DataTypes } from "sequelize";
import sequelize from "../../lib";

// user interface
export interface user extends Model {
  user_id: number;
  kanlyte_id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  auth: string;
  phone: string;
  role: "user" | "admin";
  profile_picture: string;
  refresh_token: string;
}

// Define the user model
const User = sequelize.define<user>(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    kanlyte_id: { type: DataTypes.STRING },
    first_name: { type: DataTypes.STRING },
    last_name: { type: DataTypes.STRING },
    username: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    auth: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING, defaultValue: "user" },
    profile_picture: { type: DataTypes.STRING, defaultValue: "N/A" },
    refresh_token: { type: DataTypes.STRING, defaultValue: "N/A" },
  },
  {
    tableName: "user",
  }
);
export default User;