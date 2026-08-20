package com.cinema.booking.service;

import com.cinema.booking.document.Movie;
import com.cinema.booking.document.Person;
import com.cinema.booking.dto.PersonAiResponseDto;

import java.util.List;

public interface PersonService {
    List<Person> layTatCa(String search, String roleType);
    Person timTheoId(String id);
    Person taoMoi(Person person);
    Person capNhat(String id, Person person);
    void xoa(String id);
    List<Movie> timPhimTheoPerson(String personIdOrName);
    PersonAiResponseDto tuDongDienThongTinAi(String name);
}
