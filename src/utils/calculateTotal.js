export const calculateProjectTotal = (checkpoints = []) => {
    return checkpoints.reduce((total, cp) => total + (Number(cp.cost) || 0), 0);
};

export const calculateProjectDays = (checkpoints = []) => {
    return checkpoints.reduce((total, cp) => total + (Number(cp.days) || 0), 0);
};

export const calculateProgress = (checkpoints = []) => {
    if (checkpoints.length === 0) return 0;
    const completed = checkpoints.filter((cp) => cp.completed).length;
    return Math.round((completed / checkpoints.length) * 100);
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};
