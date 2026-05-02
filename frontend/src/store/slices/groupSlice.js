import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";

export const getGroups = createAsyncThunk("groups/getGroups", async () => {
  const res = await axiosInstance.get("/groups");
  return res.data;
});

export const getGroupDetails = createAsyncThunk("groups/getGroupDetails", async (groupId) => {
  const res = await axiosInstance.get(`/groups/${groupId}`);
  return res.data;
});

export const createGroup = createAsyncThunk("groups/createGroup", async (data) => {
  const res = await axiosInstance.post("/groups", data);
  return res.data;
});

export const updateGroup = createAsyncThunk("groups/updateGroup", async ({ groupId, data }) => {
  const res = await axiosInstance.put(`/groups/${groupId}`, data);
  return res.data;
});

export const addMembers = createAsyncThunk("groups/addMembers", async ({ groupId, memberIds }) => {
  const res = await axiosInstance.post(`/groups/${groupId}/members`, { memberIds });
  return res.data;
});

export const removeMember = createAsyncThunk("groups/removeMember", async ({ groupId, memberId }) => {
  const res = await axiosInstance.delete(`/groups/${groupId}/members/${memberId}`);
  return res.data;
});

export const leaveGroup = createAsyncThunk("groups/leaveGroup", async (groupId) => {
  await axiosInstance.post(`/groups/${groupId}/leave`);
  return groupId;
});

const initialState = {
  groups: [],
  selectedGroup: null,
  isLoading: false,
  error: null,
};

const groupSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    setSelectedGroup: (state, action) => {
      state.selectedGroup = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getGroups.fulfilled, (state, action) => {
        state.groups = action.payload;
      })
      .addCase(getGroupDetails.fulfilled, (state, action) => {
        state.selectedGroup = action.payload;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.groups.push(action.payload);
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        const index = state.groups.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
        if (state.selectedGroup?._id === action.payload._id) {
          state.selectedGroup = action.payload;
        }
      })
      .addCase(addMembers.fulfilled, (state, action) => {
        const index = state.groups.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
        if (state.selectedGroup?._id === action.payload._id) {
          state.selectedGroup = action.payload;
        }
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        const index = state.groups.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
        if (state.selectedGroup?._id === action.payload._id) {
          state.selectedGroup = action.payload;
        }
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter((g) => g._id !== action.payload);
        if (state.selectedGroup?._id === action.payload) {
          state.selectedGroup = null;
        }
      });
  },
});

export const { setSelectedGroup } = groupSlice.actions;
export default groupSlice.reducer;

