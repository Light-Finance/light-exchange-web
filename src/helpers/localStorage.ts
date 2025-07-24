export const setItem = async (key: string, item: string) => {
  try {
    await localStorage.setItem(key, item);
  } catch (error) {
    console.log(error);
  }
};
export const getItem = async (key: string) => {
  try {
    const value = await localStorage.getItem(key);
    return value;
  } catch (error) {}
};

export const removeItem = async (key: string) => {
  try {
    const value = await localStorage.removeItem(key);
    return value;
  } catch (error) {}
};
