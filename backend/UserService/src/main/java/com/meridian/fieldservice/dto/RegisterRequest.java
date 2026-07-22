package com.meridian.fieldservice.dto;


import com.meridian.fieldservice.enums.Role;

public  class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private Role role;

    // getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
