export function calculateLateDepositDeduction(daysLate: number, depositAmount: number) {
  const normalizedDays = Math.max(0, Math.floor(daysLate));

  let percentage = 0;
  if (normalizedDays >= 1 && normalizedDays <= 3) percentage = 5;
  if (normalizedDays >= 4 && normalizedDays <= 7) percentage = 15;
  if (normalizedDays >= 8 && normalizedDays <= 14) percentage = 30;
  if (normalizedDays >= 15 && normalizedDays <= 30) percentage = 50;
  if (normalizedDays > 30) percentage = 100;

  const deduction = Number(((depositAmount * percentage) / 100).toFixed(2));
  return {
    daysLate: normalizedDays,
    percentage,
    deduction,
    refundableAmount: Number(Math.max(0, depositAmount - deduction).toFixed(2))
  };
}
