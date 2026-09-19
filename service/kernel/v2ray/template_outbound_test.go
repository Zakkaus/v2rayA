package v2ray

import (
	"reflect"
	"sort"
	"testing"
)

func TestBalancedSnapshotNodeIPs(t *testing.T) {
	tmpl := &Template{}
	data := NewServerData([]serverInfo{socksInfo("proxy", "192.0.2.1"), socksInfo("proxy", "192.0.2.2")})
	if _, _, err := tmpl.resolveOutbounds(data); err != nil {
		t.Fatal(err)
	}
	ips := collectNodeIPs(tmpl)
	sort.Strings(ips)
	if want := []string{"192.0.2.1", "192.0.2.2"}; !reflect.DeepEqual(ips, want) {
		t.Fatalf("snapshot bypass IPs: %v, want %v", ips, want)
	}
}
