// A photo's shape (width / height): its own `ratio`, or 3:2 for wide ones, 2:3 for the rest
export const shapeOf = (item) => item.ratio ?? (item.wide ? 3 / 2 : 2 / 3)
