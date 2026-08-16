package com.keystone.fsm.repository;

import com.keystone.fsm.entity.ServiceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    Page<ServiceRequest> findByCustomerId(Long customerId, Pageable pageable);
    Page<ServiceRequest> findByStatus(String status, Pageable pageable);
}
