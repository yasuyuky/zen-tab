import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import tabReducer from "./tabSlice";

export const store = configureStore({
  reducer: {
    tabs: tabReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
