import apiClient from "./apiClient";

export const getAllDepartments = async() => {
  try {
    const response = await apiClient.get('/department');
    return response.data;

  } catch (error) {
    console.error('❌ DepartmentsAPI: Get Departments error occurred');
    console.error('📥 DepartmentsAPI: Error response:', error.response);
    console.error('📥 DepartmentsAPI: Error data:', error.response?.data);
    throw error;
  }

}
export const createDepartment = async(departmentData) => {
  try {
    const response = await apiClient.post('/department', departmentData);
    if(!departmentData.name) {
      throw new Error("Name is required")
    }
    return response.data;
  } catch (error) {
    console.error('❌ DepartmentsAPI: Create Department error occurred');
    console.error('📥 DepartmentsAPI: Error response:', error.response);
    console.error('📥 DepartmentsAPI: Error data:', error.response?.data);
    throw error;
  }

};
export const updateDepartment = async(departmentId, departmentData) => {
  try {
    const response = await apiClient.patch(`/department/${departmentId}`, departmentData);
    return response.data;
  } catch (error) {
    console.error('❌ DepartmentsAPI: Update Department error occurred');
    console.error('📥 DepartmentsAPI: Error response:', error.response);
    console.error('📥 DepartmentsAPI: Error data:', error.response?.data);
    throw error;
  }
}