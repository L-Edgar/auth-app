import { Model, DataTypes } from "sequelize";
import sequelize from "../../../lib";

/**  OTP interface* */

export interface otp extends Model {
  otp_id: number;
  user_id: number;
  otp: string;
  expiry: Date;
}

/**  defining the Otp model* */
const Otp = sequelize.define<otp>(
  "otp",
  {
    otp_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiry: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "otp",
  }
);

export default Otp;
