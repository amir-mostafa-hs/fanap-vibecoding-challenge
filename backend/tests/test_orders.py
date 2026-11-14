from __future__ import annotations

from app.ingest import extract_order_ref


def test_order_ref_field_preferred() -> None:
    assert extract_order_ref("BZ-12345", "body mentioning BZ-99999") == "BZ-12345"


def test_order_ref_from_body() -> None:
    assert extract_order_ref(None, "my order is bz-4242 please check") == "BZ-4242"


def test_order_ref_persian_digits() -> None:
    assert extract_order_ref("BZ-۴۸۲۱۹", None) == "BZ-48219"
    assert extract_order_ref(None, "سلام سفارش من bz-۴۸۲۱۹ هست") == "BZ-48219"


def test_order_ref_arabic_digits() -> None:
    assert extract_order_ref("BZ-١٢٣٤٥", None) == "BZ-12345"


def test_order_ref_none_when_missing() -> None:
    assert extract_order_ref(None, "سلام خسته نباشید") is None
    assert extract_order_ref("", "") is None
