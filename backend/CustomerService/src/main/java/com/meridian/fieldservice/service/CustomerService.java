package com.meridian.fieldservice.service;

import org.springframework.data.domain.Pageable;

import com.meridian.fieldservice.dto.CustomerRequest;
import com.meridian.fieldservice.dto.CustomerResponse;

import java.util.List;

public interface CustomerService {
    CustomerResponse createCustomer(CustomerRequest request);
    CustomerResponse updateCustomer(Long id, CustomerRequest request);
    CustomerResponse getCustomerById(Long id);
    List<CustomerResponse> getAllCustomers();
    org.springframework.data.domain.Page<CustomerResponse> getCustomersPaginated(Pageable pageable);
    org.springframework.data.domain.Page<CustomerResponse> searchCustomersByName(String name, Pageable pageable);
    void deleteCustomer(Long id);
}