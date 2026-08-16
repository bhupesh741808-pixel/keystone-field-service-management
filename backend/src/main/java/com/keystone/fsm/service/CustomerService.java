package com.keystone.fsm.service;

import com.keystone.fsm.dto.CustomerDTO;
import com.keystone.fsm.entity.Customer;
import com.keystone.fsm.mapper.DtoMapper;
import com.keystone.fsm.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(DtoMapper::toCustomerDTO)
                .collect(Collectors.toList());
    }

    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + id));
        return DtoMapper.toCustomerDTO(customer);
    }

    @Transactional
    public CustomerDTO createCustomer(CustomerDTO dto) {
        Customer customer = DtoMapper.toCustomerEntity(dto);
        customer = customerRepository.save(customer);
        return DtoMapper.toCustomerDTO(customer);
    }

    @Transactional
    public CustomerDTO updateCustomer(Long id, CustomerDTO dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + id));

        customer.setCompanyName(dto.getCompanyName());
        customer.setContactPerson(dto.getContactPerson());
        customer.setPhone(dto.getPhone());
        customer.setEmail(dto.getEmail());

        customer = customerRepository.save(customer);
        return DtoMapper.toCustomerDTO(customer);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new IllegalArgumentException("Customer not found with ID: " + id);
        }
        customerRepository.deleteById(id);
    }
}
