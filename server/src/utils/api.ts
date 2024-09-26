export const genAPIKey = (): string => {
    return [...Array(30)].map(() => ((Math.random() * 36) | 0).toString(36)).join('');
};
