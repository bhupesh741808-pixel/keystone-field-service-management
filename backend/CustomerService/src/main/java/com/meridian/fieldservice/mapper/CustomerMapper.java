package com.meridian.fieldservice.mapper;

import com.meridian.fieldservice.dto.CustomerRequest;
import com.meridian.fieldservice.dto.CustomerResponse;
import com.meridian.fieldservice.entity.Customer;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {

    public Customer toEntity(CustomerRequest request) {
        Customer customer = new Customer();
        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setAddressLine(request.getAddressLine());
        customer.setCity(request.getCity());
        customer.setState(request.getState());
        customer.setPostalCode(request.getPostalCode());
        customer.setCountry(request.getCountry());
        return customer;
    }

    public CustomerResponse toResponse(Customer customer) {
        CustomerResponse response = new CustomerResponse();
        response.setId(customer.getId());
        response.setName(customer.getName());
        response.setEmail(customer.getEmail());
        response.setPhone(customer.getPhone());
        response.setAddressLine(customer.getAddressLine());
        response.setCity(customer.getCity());
        response.setState(customer.getState());
        response.setPostalCode(customer.getPostalCode());
        response.setCountry(customer.getCountry());
        response.setCreatedBy(customer.getCreatedBy());
        response.setCreatedDate(customer.getCreatedDate());
        response.setLastModifiedBy(customer.getLastModifiedBy());
        response.setLastModifiedDate(customer.getLastModifiedDate());
        response.setVersion(customer.getVersion());
        return response;
    }

    public void updateEntity(Customer customer, CustomerRequest request) {
        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setAddressLine(request.getAddressLine());
        customer.setCity(request.getCity());
        customer.setState(request.getState());
        customer.setPostalCode(request.getPostalCode());
        customer.setCountry(request.getCountry());
    }
}