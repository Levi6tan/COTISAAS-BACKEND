import mongoose from 'mongoose'

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  nit: { type: String, required: true },
  phone: { type: String },
  terms: { type: String },
  // conexion con el userSchema, se guarda el ID del usuario dueño de esta empresa
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  }
}, { timestamps: true });

const company = new mongoose.model('Company', companySchema)

export default company
