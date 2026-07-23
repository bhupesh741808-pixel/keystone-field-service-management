package com.meridian.fieldservice.service;

import com.meridian.fieldservice.dto.CustomerRequest;
import com.meridian.fieldservice.dto.CustomerResponse;
import com.meridian.fieldservice.exception.DuplicateResourceException;
import com.meridian.fieldservice.exception.ResourceNotFoundException;
import com.meridian.fieldservice.mapper.CustomerMapper;
import com.meridian.fieldservice.entity.Customer;
import com.meridian.fieldservice.repository.CustomerRepository;
import com.meridian.fieldservice.service.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    @Override
    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'MANAGER')")
    public CustomerResponse createCustomer(CustomerRequest request) {
        log.info("Creating customer with email: {}", request.getEmail());
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Customer already exists with email: " + request.getEmail());
        }
        Customer customer = customerMapper.toEntity(request);
        Customer saved = customerRepository.save(customer);
        log.info("Customer created with id: {}", saved.getId());
        return customerMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'MANAGER')")
    public CustomerResponse updateCustomer(Long id, CustomerRequest request) {
        log.info("Updating customer with id: {}", id);
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        // Check email uniqueness if changed
        if (!existing.getEmail().equals(request.getEmail()) &&
                customerRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already taken: " + request.getEmail());
        }

        customerMapper.updateEntity(existing, request);
        Customer updated = customerRepository.save(existing);
        log.info("Customer updated with id: {}", updated.getId());
        return customerMapper.toResponse(updated);
    }

    @Override
    public CustomerResponse getCustomerById(Long id) {
        log.debug("Fetching customer by id: {}", id);
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return customerMapper.toResponse(customer);
    }

    @Override
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'MANAGER', 'TECHNICIAN')")
    public List<CustomerResponse> getAllCustomers() {
        log.debug("Fetching all customers");
        return customerRepository.findAll().stream()
                .map(customerMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'MANAGER', 'TECHNICIAN')")
    public Page<CustomerResponse> getCustomersPaginated(Pageable pageable) {
        log.debug("Fetching customers paginated: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        return customerRepository.findAll(pageable)
                .map(customerMapper::toResponse);
    }

    @Override
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'MANAGER', 'TECHNICIAN')")
    public Page<CustomerResponse> searchCustomersByName(String name, Pageable pageable) {
        log.debug("Searching customers by name containing: {}", name);
        return customerRepository.searchByName(name, pageable)
                .map(customerMapper::toResponse);
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCustomer(Long id) {
        log.info("Deleting customer with id: {}", id);
        if (!customerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Customer not found with id: " + id);
        }
        customerRepository.deleteById(id);
        log.info("Customer deleted with id: {}", id);
    }
}