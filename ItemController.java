import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.List;

@RestController
public class ItemController {

    @GetMapping("/api/items")
    public List<Item> getItems() {
        // logic to return list of items
    }

    @PostMapping("/api/items")
    public Item createItem(@RequestBody Item newItem) {
        // logic to create a new item
    }
}