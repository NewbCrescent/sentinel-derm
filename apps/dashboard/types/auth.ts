export type AuthFormState = {
  status: "idle" | "error" | "success";
  message: string;
};

export type DashboardUser = {
  id: string;
  email: string;
};

export type DashboardAuthState =
  | {
      status: "authorized";
      user: DashboardUser;
    }
  | {
      status: "pending-profile";
      user: DashboardUser;
    }
  | {
      status: "signed-out";
    }
  | {
      status: "missing-config";
      message: string;
    }
  | {
      status: "error";
      message: string;
    };
