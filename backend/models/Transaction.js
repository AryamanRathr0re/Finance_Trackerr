import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    merchant: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      required: false,
      enum: [
        'Groceries',
        'Utilities',
        'Food & Drink',
        'Transport',
        'Entertainment',
        'Housing',
        'Salary',
        'Investments',
        'Transfers',
        'Other',
      ],
      default: 'Other',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Will be required once user auth is implemented
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;