export interface CreateUserDtoInterface {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  photo?: any;
}

export interface UpdateUserDtoInterface {
  firstName: string;
  lastName: string;
  bio: string;
  password: string;
  newPassword: string;
  photo: any;
}

export interface FindIndexQueryDtoInterface {
  page: number;
}
